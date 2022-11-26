const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');


const app = express();
const port = process.env.PORT || 5000;

//middle wires added
app.use(cors());
app.use(express.json());

//mongodb connection uri and client
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@cluster0.nomds.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


//verify jwt token
function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}



// async function for CRUD operation
const run = async () => {
    try {
        const categoriesCollection = client.db('thrift-bookstore').collection('categories');
        const productsCollection = client.db('thrift-bookstore').collection('products');
        const usersCollection = client.db('thrift-bookstore').collection('users');
        const ordersCollection = client.db('thrift-bookstore').collection('orders');

        //get api for jwt token
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });

        //get api for user
        app.get('/users', async (req, res) => {
            const email = req.query.email;
            const query = { email };
            const user =await usersCollection.findOne(query);
            res.send(user);
        })


        //post api for adding a user
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });


        //get api for categories
        app.get('/categories', async (req, res) => {
            let query = {};
            const cursor = categoriesCollection.find(query);
            const categories = await cursor.toArray();
            res.send(categories);
        })
        //get api for specific categories id
        app.get('/categories/:id', async (req, res) => {
            const id = req.params.id;
            const categoryQuery = { _id: ObjectId(id) };
            const category = await categoriesCollection.findOne(categoryQuery);
            const productQuery = { categoryName: category.name };
            const cursor = productsCollection.find(productQuery);
            const products = await cursor.toArray();
            console.log(products);
            res.send(products);
        })


        //post api for oder
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result);
        });
    }
    finally {

    }
}
run().catch(console.dir);


//root api 
app.get('/', (req, res) => {
    res.send('Welcome to mongodb practice server side');
})

app.listen(port, () => {
    console.log(`server side is listing at port ${port}`);
})
