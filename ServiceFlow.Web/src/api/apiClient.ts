export type ValidationErrors = Record<string, string[]>;

type ApiProblem = {
    title?: string,
    detail?: string,
    message?: string,
    errors?: ValidationErrors
}

export class ApiError extends Error {
    public readonly status: number;
    public readonly validationErrors?: ValidationErrors;

    constructor(
        message: string,
        status: number,
        validationErrors?: ValidationErrors
    ) {
        super(message);
        this.name = 'ApiError';

        this.status = status;
        this.validationErrors = validationErrors;
    }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

export async function apiRequest<T>(
    path: string,
    init: RequestInit = {}
) : Promise<T> {
    const headers = new Headers(init.headers);

    headers.set('Accept', 'application/json');

    if (init.body !== undefined && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${apiBaseUrl}${path}`, {
        ...init,
        headers,
        credentials: 'include'
    });

    if (!response.ok) {
        throw await createApiError(response);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('application/json')) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

async function createApiError(response: Response) : Promise<ApiError> {
    const responseText = await response.text();

    let problem : ApiProblem | undefined;

    try {
        problem = JSON.parse(responseText) as ApiProblem;
    } catch {
        problem = undefined;
    }

    const message = problem?.detail ?? problem?.message ?? problem?.title ?? 'An unexpected error occurred.';

    return new ApiError(message, response.status, problem?.errors);
}