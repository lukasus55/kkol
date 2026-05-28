export async function validatePassword(pass) {
    let passInfo = {
        score: 0,
        maxScore: 4,
        requirements: {
            correctLenght: false,
            notNumbersOnly: false,
            notOnList: false,
        },
        recommendations: {
            lowerCaseChar: false,
            upperCaseChar: false,
            number: false,
            specialChar: false,
            moreThan17Char: false,
            moreThan20Char: false,
            moreThan22Char: false,
        },
    }

    if (!pass || typeof pass !== "string") {
        return (passInfo);
    };

    passInfo.requirements.correctLenght = pass.length >= 14 && pass.length <= 128;
    passInfo.requirements.notNumbersOnly = !isNumbersOnly(pass);
    passInfo.requirements.notOnList = !(await isCompromisedPassword(pass));

    passInfo.recommendations.lowerCaseChar = hasLowerCase(pass);
    passInfo.recommendations.upperCaseChar = hasUpperCase(pass);
    passInfo.recommendations.number = hasNumber(pass);
    passInfo.recommendations.specialChar = hasSpecialChar(pass);
    passInfo.recommendations.moreThan17Char = pass.length > 17;
    passInfo.recommendations.moreThan20Char = pass.length > 20;
    passInfo.recommendations.moreThan22Char = pass.length > 23;

    Object.values(passInfo.recommendations).forEach(rec => {
        if (rec) passInfo.score++;
    });

    const isEveryReqFulfilled = Object.values(passInfo.requirements).every((req) => { return req });
    if (!isEveryReqFulfilled) { passInfo.score = 0 };

    passInfo.score = Math.min(passInfo.score, passInfo.maxScore);

    return passInfo;
}

export const passwordRequirementsNames = {
    correctLenght: "Ma co najmniej 14 znaków.",
    notNumbersOnly: "Nie składa się wyłącznie z cyfr.",
    notOnList: "Nie jest na liście słabych i wykradzionych haseł.",
}

export const passwordRecomendationsNames = {
    lowerCaseChar: "Zawiera małą literę (a-z).",
    upperCaseChar: "Zawiera wielką literę (A-Z).",
    number: "Zawiera numer (0-9).",
    specialChar: "Zawiera znak specjalny.",
    moreThan17Char: "Ma co najmniej 18 znaków.",
    moreThan20Char: "Ma co najmniej 20 znaków.",
    moreThan22Char: "Ma co najmniej 23 znaków.",
}

export const isNumbersOnly = (str) => { return /^\d+$/.test(str); };

export const hasLowerCase = (str) => { return /[a-z]/.test(str); };

export const hasUpperCase = (str) => { return /[A-Z]/.test(str); };

export const hasNumber = (str) => { return /\d/.test(str); };

export const hasSpecialChar = (str) => { return /[!@#$%^&*]/.test(str); };

// This function sents first 5 characters of hash for the API and the check the rest locally
export const isCompromisedPassword = async (pass) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pass);

    // Hash the password using SHA-1 (Required by HIBP API)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    try {
        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        const text = await response.text();

        return text.includes(suffix);

    } catch (error) {
        console.error("Failed to check password against API", error);
        return false;
    }
};