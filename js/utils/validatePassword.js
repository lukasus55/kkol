export function validatePassword(pass) {
    let passInfo = {
        score: 0,
        maxScore: 5,
        requirements: {
            correctLenght: false,
            notOnList: true,
        },
        recommendations: {
            lowerCaseChar: false,
            upperCaseChar: false,
            number: false,
            specialChar: false,
            moreThan17Char: false,
        },
    }

    if(!pass || typeof pass !== "string") {
        return (passInfo);
    };

    passInfo.requirements.correctLenght = pass.length >= 14 && pass.length <= 128;

    passInfo.recommendations.lowerCaseChar = hasLowerCase(pass);
    passInfo.recommendations.upperCaseChar = hasUpperCase(pass);
    passInfo.recommendations.number = hasNumber(pass);
    passInfo.recommendations.specialChar = hasSpecialChar(pass);
    passInfo.recommendations.moreThan17Char = pass.length > 17;

    Object.values(passInfo.recommendations).forEach(rec => {
        if (rec) passInfo.score++;
    });

    const isEveryReqFulfilled = Object.values(passInfo.requirements).every((req) => {return req});
    if(!isEveryReqFulfilled) {passInfo.score = 0};
    
    return passInfo;
}

export const passwordRequirementsNames = {
    correctLenght: "Ma co najmniej 14 znaków.",
    notOnList: "Nie jest na liście słabych haseł.",
}

export const passwordRecomendationsNames = {
    lowerCaseChar: "Zawiera małą literę (a-z).",
    upperCaseChar: "Zawiera wielką literę (A-Z).",
    number: "Zawiera numer (0-9).",
    specialChar: "Zawiera znak specjalny.",
    moreThan17Char: "Ma co najmniej 18 znaków.",
}

export const hasLowerCase = (str) => {return /[a-z]/.test(str);};

export const hasUpperCase = (str) => {return /[A-Z]/.test(str);};

export const hasNumber = (str) => {return /\d/.test(str);};

export const hasSpecialChar = (str) => {return /[!@#$%^&*]/.test(str);};