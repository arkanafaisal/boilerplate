export function validate(schema, body) {
    const { error, value } = schema.validate(body, { abortEarly: true });

    if (error) {
        const d = error.details[0];
        
        // UX Improvement: Clean up the field name
        // e.g., "publicId" -> "public id", "avatar_index" -> "avatar index"
        let rawField = d.path.join('.').replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').toLowerCase();
        // Capitalize the first letter for the sentence
        const field = rawField.charAt(0).toUpperCase() + rawField.slice(1);

        let message = 'Invalid input provided.';
        
        switch (d.type) {
            case 'any.required':
            case 'string.empty':
                message = `${field} is required.`;
                break;
            case 'string.min':
                message = `${field} must be at least ${d.context.limit} characters long.`;
                break;
            case 'string.max':
                message = `${field} cannot exceed ${d.context.limit} characters.`;
                break;
            case 'string.email':
                // Special check to avoid awkward phrasing like "Email is required to be a valid email"
                message = rawField.includes('email') 
                    ? 'Please enter a valid email address.' 
                    : `Please provide a valid email format for ${field.toLowerCase()}.`;
                break;
            case 'string.alphanum':
                message = `${field} can only contain letters and numbers (no special characters).`;
                break;
            case 'number.base':
                message = `${field} must be a valid number.`;
                break;
            case 'number.min':
                message = `${field} must be at least ${d.context.limit}.`;
                break;
            case 'number.max':
                message = `${field} cannot be more than ${d.context.limit}.`;
                break;
            case 'any.only':
                message = `Invalid ${field.toLowerCase()}. Please select one of the following: ${d.context.valids.join(', ')}.`;
                break;
            case 'string.pattern.base':
            case 'alternatives.match':
                message = `The format for ${field.toLowerCase()} is invalid.`;
                break;
            default:
                // Fallback: use Joi's default message but remove the ugly quotes around the variable name
                message = d.message.replace(/"/g, ''); 
                message = message.charAt(0).toUpperCase() + message.slice(1); // Capitalize
        }

        return { ok: false, message };
    }

    return { ok: true, value };
}