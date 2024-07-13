import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod' //schama validation
import { prisma } from "../lib/prisma";
import { error } from "console";
import { dayjs} from "../lib/dayjs";
import { getMailClient } from "../lib/mail";
import nodemailer from 'nodemailer'

export async function confirmTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        '/trips/:tripId/confirm', 
        //validar meus dados de entrada.body headers, params..
        {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            }),
        },
    }, 
    async (request, replay) => {
        const {tripId} = request.params

        const trip = await prisma.trip.findUnique({
            where: {
                id: tripId
            },
            include:{
                participants:{
                    where: {
                        is_owner: false,
                    }
                }
            }
        })

        if(!trip){
            throw new Error("Trip, not found.")
        }

        if(trip.is_confirmed){
            return replay.redirect(`http://localhost:3000/trips/${tripId}`)
        }

        await prisma.trip.update({
            where:{id: tripId},
            data: {is_confirmed: true},
        })

        

        const formattedStartDate = dayjs(trip.starts_at).format('LL')
        const formattedEndDate = dayjs(trip.ends_at).format('LL')

        const mail = await getMailClient()

        await Promise.all(
            //map percorra um array, e retorne um novo array com novos dados dentro.
            trip.participants.map(async(participant)=>{
                const confirmationLink = `http://localhost:3333/trips/${trip.id}/confirm/${participant.id}`
                const message = await mail.sendMail({
                    from: {
                        name: 'Equipe Plann.er',
                        address: 'oi@plann.er',
                    },
                    to: participant.email,
                    subject: `Confirme sua presença na viagem para ${trip.destination} em ${formattedStartDate}`,
                    html: `
                    <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
                        <p> Você foi convidado a participar de uma viagem para <strong>${trip.destination}</strong> nas datas de <strong>${formattedStartDate}</strong> até <strong>${formattedEndDate}.</strong> </p>
                        <p></p>
                        <p> Para confirmar sua presença na viagem, clique no link abaixo: </p>
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
            })
        )

        return replay.redirect(`http://localhost:3000/trips/${tripId}`)
    })
}