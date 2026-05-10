import { ZodTypeAny } from "zod";

export function validateHelper(schema: ZodTypeAny, data: any) {
    const result = schema.safeParse(data);

    if (!result.success) {
        const d = result.error.issues[0];
        
        let rawField = d.path.length > 0 ? d.path.join('.') : 'input';
        rawField = rawField.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').toLowerCase();
        const field = rawField.charAt(0).toUpperCase() + rawField.slice(1);
        
        let message = d.message || 'Invalid input provided.';
        
        switch (d.code) {
            case 'invalid_type':
                if (d.message === 'Required' || d.received === 'undefined') {
                    message = `${field} is required.`;
                } else {
                    message = `${field} must be a valid ${d.expected}.`;
                }
                break;
            case 'too_small':
                message = `${field} must be at least ${d.minimum} ${d.type === 'string' ? 'characters long' : 'in value'}.`;
                break;
            case 'too_big':
                message = `${field} cannot exceed ${d.maximum} ${d.type === 'string' ? 'characters' : 'in value'}.`;
                break;
            case 'invalid_string':
                if (d.validation === 'email') {
                    message = rawField.includes('email') 
                        ? 'Please enter a valid email address.' 
                        : `Please provide a valid email format for ${field.toLowerCase()}.`;
                } else if (d.validation === 'regex') {
                    message = `The format for ${field.toLowerCase()} is invalid.`;
                } else {
                    message = `Invalid format for ${field.toLowerCase()}.`;
                }
                break;
            case 'invalid_union':
                message = `Invalid ${field.toLowerCase()} format.`;
                break;
            case 'custom':
                if (!d.message || d.message === 'Invalid input') {
                    message = `${field} is invalid.`;
                }
                break;
            default:
                message = message.charAt(0).toUpperCase() + message.slice(1);
        }

        return { ok: false, message };
    }

    return { ok: true, value: result.data };
}
