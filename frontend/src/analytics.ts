// IMPORTANT!!!!!
// NOTHING IN THIS FILE SHOULD ALLOW THE USER TO HAVE AN IDENTIFIER WITHOUT USER CONSENT

const CONSENT_YES = "I'm doing my part!";
const CONSENT_NO = "I have the right to remain silent.";

export function hasUserConsented(): boolean {
    const consentOutcome = localStorage.getItem("consentOutcome");

    if (consentOutcome == CONSENT_YES) {
        return true;
    } else {
        // If user ID is somehow present remove it
        localStorage.removeItem("userId");

        return false;
    }
}

// If the user has accepted or declined we shouldn't ask
export function shouldAskUser(): boolean {
    return localStorage.getItem("consentOutcome") == null;
}

export function giveConsent() {
    // Set consent to yes
    localStorage.setItem("consentOutcome", CONSENT_YES);
}

export function stayPrivate() {
    // If user ID is somehow present remove it
    localStorage.removeItem("userId");
    // Set consent to no
    localStorage.setItem("consentOutcome", CONSENT_NO);
}

export function getUserIdentifier(): string | undefined {
    if (!hasUserConsented())
        return undefined;

    let id = localStorage.getItem("userId");
    if (!id)
        id = generateUserIdentifier();

    return id;
}

function generateUserIdentifier(): string {
    const id = crypto.randomUUID();
    localStorage.setItem("userId", id);
    return id;
}

// Won't add header if the user ID isn't present (if the user hasn't consented)
export async function addUserIdHeader(headers?: HeadersInit | undefined): Promise<HeadersInit | undefined> {
    let id = getUserIdentifier();
    if (!id)
        return headers;

    if (!headers)  {
        return {
            'UID': id,
        };
    }

    return Object.assign(headers, {
        'UID': id,
    });
}