import express from "express";
import cors from 'cors';
import dayjs from 'dayjs';
import { MongoClient, ObjectId } from "mongodb";
import dotenv from 'dotenv';
import joi from 'joi';

dotenv.config()

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;
mongoClient.connect().then(() => {
    db = mongoClient.db('batePapoUOL3')
})

// joi objects-------------------------------------
const userSchema = joi.object({
    name: joi.string().required()
})

const messageSchema = joi.object({
    from: joi.string().required(),
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required().valid("message", "private_message"),
    time: joi.string(),
})

// Participants ---------------------------------------------------

app.post('/participants', async (req, res) => { //Login
    const { name: username } = req.body

    //validação com joi
    const validation = userSchema.validate(req.body);
    if (validation.error) {
        const errors = validation.error.details.map(value => value.message)
        res.status(422).send(errors)
        return;
    }

    try {
        const usersCollection = await db.collection('participants').findOne({ username: username });
        if (usersCollection) {
            res.sendStatus(409)
            return;
        }
    } catch (error) {
        console.error(error);
        res.sendStatus(500)
    }

    const time = dayjs(new Date()).format('HH-mm-ss')

    const message = {
        from: username,
        to: 'Todos',
        text: 'entra na sala...',
        type: 'status',
        time: time,
    }

    try {
        const responsePart = await db.collection('participants').insertOne({ username: username, lastStatus: Date.now() })
        const responseMessage = await db.collection('messages').insertOne( {...message} )
        res.send(responsePart)
    } catch (error) {
        console.error(error)
        res.sendStatus(422)
    }

})

app.get('/participants', async (req, res) => {

    try {
        const response = await db.collection('participants').find().toArray();
        res.status(201).send(response)//RETORNAR SENDSTATUS SÓ
    } catch (error) {
        console.error(error)
        res.sendStatus(404)
    }
})

// Messages------------------------------------------------------------------

app.post('/messages', async (req, res) => {
    const userMessage = req.body
    const { user: username } = req.headers

    const time = dayjs(new Date()).format('HH-mm-ss')

    const message = {
        ...userMessage,
        from: username,
        time: time,
    }

    //validação
    // if -> from
    const user = await db.collection('participants').findOne({ username: username })

    if (!user) {
        res.status(422).send({ error: 'Esse usuário não está logado.' })
        return;
    };

    //joi -> text, to, type 

    const validation = messageSchema.validate(message);
    if (validation.error) {
        const errors = validation.error.details.map(value => value.message)
        res.status(422).send(errors)
        return;
    }

    // insertOne
    try {
        const response = await db.collection('messages').insertOne( {...message} );
        res.sendStatus(201)
    } catch (error) {
        console.error(error)
        res.sendStatus(422)
    }

})

app.get('/messages', async (req, res) => {
    const { User: username } = req.headers
    const { limit } = req.query;

    //find & showMessages
    try {
        const response = await db.collection('messages').find().toArray()

        const showMessages = response.filter((message) => {
            if (message.type === 'private_message' && (message.to !== username || message.from !== username)) {
                return false;
            }
            return true;
        })

        const limitMessages = showMessages.slice(0, limit)
        res.send(limitMessages);
    } catch (error) {
        console.error(error)
        res.status(500).send(error)
    }
})

// status-------------------------------------------------------------------------------------
app.post('/status', async (req, res) => {
    const { user: username } = req.headers

    // verificar se o nome ta na lista
    const userCollectionArray = await db.collection('participants').find().toArray()
    const usernameArray = userCollectionArray.map(value => value.username)

    if (!usernameArray.includes(username)) {
        res.sendStatus(404);
        return;
    }

    //  atualizar lastStatus
    const user = await db.collection('participants').findOne({ username: username })

    const userModel = {
        _id: user._id,
        username: username,
        lastStatus: Date.now(),
    }
    await db
        .collection('participants')
        .updateOne({ username: username }, { $set: userModel })

    res.sendStatus(200);

})

//delete--------------------------------------------------------------------
app.delete('/participants/:id', async (req, res) => {
    //ACHO Q ISSO AQUI ENTRA NO STATUS COM O SET INTERVAL
    const { id } = req.params

    try {
        const response = await db.collection('participants').deleteOne({ _id: new ObjectId(id) })
        res.send(response)
    } catch (error) {
        console.error(error)
        res.sendStatus(404)
    }

});

app.delete('/messages/:id', async (req, res) => {
    const { id } = req.params

    try {
        const response = await db.collection('messages').deleteOne({ _id: new ObjectId(id) })
        res.send(response)
    } catch (error) {
        console.error(error)
        res.sendStatus(404)
    }
});

//  editar--------------------------------------------------------------------

const newMessageSchema = joi.object({
    from: joi.string().required(),
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required().valid("message", "private_message"),
})
app.put('/messages/:id', async (req, res) => {
    const { id } = req.params
    const { user: username } = req.headers

    const newMessage = {
        ...req.body,
        from: username,
    }

    // validação
        // if -> from
    const user = await db.collection('participants').findOne({username: username})

    if (user) {
        res.status(422).send({ error: 'Esse usuário não está logado.' })
        return;
    };
        // joi -> to, text, type

    const validation = newMessageSchema.validate(newMessage)

    if (validation.error) {
        res.sendStatus(422)
        return;
    }

    try {
        const message = await db.collection('messages').findOne({ _id: new ObjectId(id) })

        if (!message) {
            res.status(404).send(message)
            return;
        }

        if (message.from !== username) {
            res.status(401).send(message)
            return;
        }
        await db.collection('messages').updateOne({_id: new ObjectId(id)},{ $set: newMessage })

        res.sendStatus(200)
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }

});


setInterval( async () => {


    try {
        const users = await db.collection('participants').find().toArray();
        const usersOff = users.filter(user => Date.now() - user.lastStatus > 10000)
        
        usersOff.forEach(user => {
            db.collection('participants').deleteOne({ _id: new ObjectId(user._id) })

            const time = dayjs(new Date()).format('HH-mm-ss')

            const message = {
                from: user.username,
                to: 'Todos',
                text: 'sai da sala...',
                type: 'status',
                time: time,
            }

            db.collection('messages').insertOne({...message});
        });

    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
}, 15000)


app.listen(PORT, () => console.log('ligou hein'));