import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod' //schama validation
import localizedFormat from 'dayjs/plugin/localizedFormat'
import nodemailer from 'nodemailer'
import dayjs, { Dayjs } from "dayjs";
import 'dayjs/locale/pt-br'
import { prisma } from "../lib/prisma";
import { getMailClient } from "../lib/mail";


dayjs.locale('pt-br')
dayjs.extend(localizedFormat)

export async function createTrip(app: FastifyInstance) {
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
                //e-mails vai ser um array, onde vai ser um array com vários e-mails.
                emails_to_invite: z.array(z.string().email())

            })
        },
    }, async (request) => {
        const { destination, starts_at, ends_at, owner_name, owner_email, emails_to_invite } = request.body

        if (dayjs(starts_at).isBefore(new Date())) {
            throw new Error('Invalid trip start date.')
        }

        if (dayjs(ends_at).isBefore(starts_at)) {
            throw new Error('Invalid trip day, the ends is before the start.')
        }

        //transaction: se alguma schama/ query falha, desfaz e roda tudo novamente.

        const trip = await prisma.trip.create({
            data: {
                destination,
                starts_at,
                ends_at,
                participants: {
                    createMany: {
                        data: [
                            {
                                name: owner_name,
                                email: owner_email,
                                is_owner: true,
                                is_confirmed: true,
                            },
                            //vou percorrer a lista de emails aqui
                            //... para concatenar o meu array de e-mails 
                            ...emails_to_invite.map(email => {
                                return { email }
                            })
                        ],
                    }
                }
            }
        })


        const formattedStartDate = dayjs(starts_at).format('LL')
        const formattedEndDate = dayjs(ends_at).format('LL')


        const confirmationLink = `http://localhost:3333/trips/${trip.id}/confirm`

        const mail = await getMailClient()

        const message = await mail.sendMail({
            from: {
                name: 'Equipe Plann.er',
                address: 'oi@plann.er',
            },
            to: {
                name: owner_name,
                address: owner_email,
            },
            subject: `Confirme sua viagem para ${destination} em ${formattedStartDate}`,
            html: `
            <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
                <p> Você solicitou a criação de uma viagem para <strong>${destination}</strong> nas datas de <strong>${formattedStartDate}</strong> até <strong>${formattedEndDate}.</strong> </p>
                <p></p>
                <p> Para confirmar sua viagem, clique no link abaixo: </p>
                <p></p>
                <p> 
                    <a href="${confirmationLink}"> Confirmar Viagem </a> 
                </p>
                <p></p>
                <p> Caso você não saiba do que se trata esse e-mail, apenas ignore esse e-mail. </p> 
            </div>
            `.trim()
            //trim para tirar os espaços desnecessarios
        })

        console.log(nodemailer.getTestMessageUrl(message))

        return { tripId: trip.id }
    })
}