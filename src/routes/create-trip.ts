import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod' //schama validation


export async function createTrip(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().post('/trips', {
        //validar meus dados de entrada.body headers, params..
        schema: {
            body: z.object({
                destination: z.string().min(4),
                /*json n consegue enviar classes do Backend para o frontend,
                 apenas tipos primitivos, então a data vai chegar como String '2024-06-23 10:00:00'*/
                starts_at: z.coerce.date(),
                ends_at: z.coerce.date(),
                
            })
        },
    }, async (request) => {
        const { destination, starts_at, ends_at} = request.body
        
        return {
            destination,
            starts_at,
            ends_at
        }
    })
}