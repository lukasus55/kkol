"use client";

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';
import './swagger-custom.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function DocsPage() {
    return (
        <div className="bg-bg-100 min-h-screen pt-4">
            <SwaggerUI url="/api/doc" />
        </div>
    );
}
