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

const messages = [];

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

    let message = {...userMessage,
    from: user,
    time: time,
    id: Date.now(),
    }

    messages.push(message)

    res.send(messages)
})

app.get('/messages', (req, res) => {

})

app.post('/status', (req, res) => {

})


app.listen(PORT, () => console.log('ligou hein'));