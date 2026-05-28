export function validatePassword(pass: string) {
    let requirements = {
        correctLenght: false
    }
    let recommendations = {
        lowerCaseChar: false,
        upperCaseChar: false,
        number: false,
        specialChar: false,
    }
    let score=0;

    if(!pass || typeof pass !== "string") {
        return ({score: score, requirements: requirements, recommendations: recommendations});
    };

    requirements.correctLenght = pass.length >= 14 && pass.length <= 128;
    recommendations.lowerCaseChar = hasLowerCase(pass);
    recommendations.upperCaseChar = hasUpperCase(pass);
    recommendations.number = hasNumber(pass);
    recommendations.specialChar = hasSpecialChar(pass);

    Object.values(recommendations).forEach(r => {
        if (r) score++;
    });
    
    return ({
        score: score, 
        requirements: requirements,
        recommendations: recommendations,
    });
}

export const hasLowerCase = (str: string): boolean => {return /[a-z]/.test(str);};

export const hasUpperCase = (str: string): boolean => {return /[A-Z]/.test(str);};

export const hasNumber = (str: string): boolean => {return /\d/.test(str);};

export const hasSpecialChar = (str: string): boolean => {return /[!@#$%^&*]/.test(str);};