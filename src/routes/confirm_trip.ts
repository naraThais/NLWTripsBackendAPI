import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod' //schama validation


export async function confirmTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/confirm', {
        //validar meus dados de entrada.body headers, params..
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            })
        },
    }, async (request) => {
        return { tripId: request.params.tripId }
    })
}