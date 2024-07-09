import fastify from 'fastify';
import {prisma} from './lib/prisma';

const app = fastify ()


app.get('/teste', ()=>{
    return 'Hello Wolrd!'
})

app.get('/cadastrar', async()=>{
    await prisma.trip.create({
        data: {
            destination:'Paraná',
            starts_at: new Date(),
            ends_at: new Date()
        },
    })
    return 'Cadastrado com Sucesso!'
})

app.get('/listar', async()=>{
    const trips = await prisma.trip.findMany()
    
    return trips
})


app.listen({ port: 3333}).then(()=>{
    console.log('Server runing!')
})

