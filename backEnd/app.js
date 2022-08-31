import express from "express";
import cors from 'cors';
import dayjs from 'dayjs';

// dayjs().format()

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const users = [
    {
        "name": "victor",
        "id": 1661941740625
    },
    {
        "name": "cid",
        "id": 1661941746881
    },
    {
        "name": "hugo",
        "id": 1661941750313
    }
];

const messages = [
    {
        "to": "Maria",
        "text": "vai funfar sim!!!",
        "type": "message",
        "from": "narutin",
        "time": "15-00-00",
        "id": 1661968800446
    },
    {
        "to": "narutin",
        "text": "bora codar",
        "type": "message",
        "from": "maria",
        "time": "15-00-01",
        "id": 1661968801118
    },
    {
        "to": "renata",
        "text": "piratinha bolado",
        "type": "private_message",
        "from": "hugo",
        "time": "15-00-09",
        "id": 1661968809424
    },
    {
        "to": "victor",
        "text": "vai funfar sim!!!",
        "type": "private_message",
        "from": "renata",
        "time": "15-00-09",
        "id": 1661968809785
    },{
        "to": "Maria",
        "text": "vai funfar sim!!!",
        "type": "message",
        "from": "narutin",
        "time": "15-00-00",
        "id": 1661968800446
    },
    {
        "to": "narutin",
        "text": "bora codar",
        "type": "message",
        "from": "maria",
        "time": "15-00-01",
        "id": 1661968801118
    },
    {
        "to": "renata",
        "text": "piratinha bolado",
        "type": "private_message",
        "from": "hugo",
        "time": "15-00-09",
        "id": 1661968809424
    },
    {
        "to": "victor",
        "text": "vai funfar sim!!!",
        "type": "private_message",
        "from": "renata",
        "time": "15-00-09",
        "id": 1661968809785
    },
];

app.post('/participants', (req, res) => { //Login
    const { name } = req.body

    if (!name) {
        res.status(422).send({ error: 'digita alguma coisa aí, irmão' })
        return;
    }

    const isUserExist = users.find((user) => user.name === name)
    if (isUserExist) {
        res.status(409).send({ error: 'já tem esse nome aí, manda outro' })
        return;
    }

    const time = dayjs(new Date()).format('HH-mm-ss')

    let message = {
        from: name,
        to: 'Todos',
        text: 'entra na sala...',
        type: 'status',
        time: time,
        id: Date.now()
    }
    messages.push(message)

    users.push({ name, id: Date.now() })  //vai virar mongo
    res.status(201).send(users)
})

app.get('/participants', (req, res) => {

    res.send(users) //vai vir do mongo
})

app.post('/messages', (req, res) => {
    const userMessage = req.body
    const { user } = req.headers

    const time = dayjs(new Date()).format('HH-mm-ss')

    let message = {
        ...userMessage,
        from: user,
        time: time,
        id: Date.now(),
    }

    messages.push(message)
    res.send(messages)
})

app.get('/messages', (req, res) => {
    const { user: username } = req.headers
    const { limit } = req.query;

    // vou ter q pegar as mensagens com mongo
    const showMessages = messages.filter((message) => {
        if (message.type === 'private_message' && (message.to !== username || message.from !== username)) {
            return false;
        }
        return true;
    })

    const limitMessages = showMessages.slice(0,limit)
    res.send(limitMessages)
})

app.post('/status', (req, res) => {

})


app.listen(PORT, () => console.log('ligou hein'));