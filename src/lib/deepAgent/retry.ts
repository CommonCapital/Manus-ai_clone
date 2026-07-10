export const MAX_MODEL_RETRIES = 3;

export const isRateLimitError = (error: any) => {
    const message = String(error?.message ?? "");
    return error?.status === 429 || /429|rate limit/i.test(message);
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const backoffMs = (attempt: number) => 2000 * (attempt + 1);
