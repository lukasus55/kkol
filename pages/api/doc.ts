import { NextApiRequest, NextApiResponse } from 'next';
import { getApiDocs } from '../../lib/swagger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const spec = await getApiDocs();
        res.status(200).json(spec);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate swagger docs' });
    }
}
