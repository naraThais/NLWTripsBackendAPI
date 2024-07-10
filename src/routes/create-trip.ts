import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod' //schama validation
import nodemailer from 'nodemailer'
import dayjs, { Dayjs } from "dayjs";
import { prisma } from "../lib/prisma";
import { getMailClient } from "../lib/mail";


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
                owner_name: z.string(),
                owner_email: z.string().email(),

                
            })
        },
    }, async (request) => {
        const { destination, starts_at, ends_at, owner_name, owner_email} = request.body
        
        if (dayjs(starts_at).isBefore(new Date())){
            throw new Error('Invalid trip start date.')
        }

        if (dayjs(ends_at).isBefore(starts_at)){
            throw new Error('Invalid trip day, the ends is before the start.')
        }

//transaction: se alguma schama/ query falha, desfaz e roda tudo novamente.

        
        const trip = await prisma.trip.create({
            data:{
                destination,
                starts_at,
                ends_at,
                participants: {
                    create:{
                        name: owner_name,
                        email: owner_email,
                        is_owner: true,
                        is_confirmed: true,
                }}
            }
        })

        const mail = await getMailClient()

        const message = await mail.sendMail({
            from:{
                name: 'Equipe Plann.er',
                address: 'oi@plann.er',
            },
            to:{
                name: owner_name,
                address: owner_email,
            },
            subject: 'Testand envio de E-mail.',
            html: `<p> Teste do envio de E-mail </p>`,
        })

        console.log(nodemailer.getTestMessageUrl(message))

        return { tripId: trip.id }
    })
}