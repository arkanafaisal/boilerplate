import { ZodTypeAny } from "zod";

export function validateHelper(schema: ZodTypeAny, data: unknown) {
    const result = schema.safeParse(data);

    if (!result.success) {
        const issue: any = result.error.issues[0];

        let rawField =
            issue.path && issue.path.length > 0
                ? issue.path.join(".")
                : "input";

        rawField = rawField
            .replace(/_/g, " ")
            .replace(/([A-Z])/g, " $1")
            .toLowerCase();

        const field =
            rawField.charAt(0).toUpperCase() + rawField.slice(1);

        let message = issue.message || "Invalid input provided.";

        switch (issue.code) {
            case "invalid_type":
                if (
                    issue.received === "undefined" ||
                    issue.message === "Required"
                ) {
                    message = `${field} is required.`;
                } else {
                    message = `${field} must be valid.`;
                }
                break;

            case "too_small":
                message = `${field} is too short.`;
                break;

            case "too_big":
                message = `${field} is too large.`;
                break;

            case "invalid_string":
                message = `Invalid format for ${field.toLowerCase()}.`;
                break;

            case "invalid_union":
                message = `Invalid ${field.toLowerCase()} format.`;
                break;

            case "custom":
                if (!issue.message || issue.message === "Invalid input") {
                    message = `${field} is invalid.`;
                }
                break;
        }

        return { ok: false as const, message };
    }

    return {
        ok: true as const,
        value: result.data,
    };
}