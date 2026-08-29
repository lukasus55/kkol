import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
    const spec = createSwaggerSpec({
        apiFolder: 'pages/api',
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'KKOL API',
                version: '2.0',
                description: 'API documentation for Karwińska Olimpiada',
            },
            components: {
                securitySchemes: {
                    cookieAuth: {
                        type: 'apiKey',
                        in: 'cookie',
                        name: 'auth_token',
                    },
                },
            },
            security: [],
        },
    });
    return spec;
};
