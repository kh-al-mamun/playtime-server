const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('PlayTime server is now running...')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wxmbqd9.mongodb.net/?retryWrites=true&w=majority`
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const animalToyCollection = client.db('play-time').collection('animal-toys');

        //send all animal toys or selected data
        app.get('/animal-toys', async (req, res) => {
            //find a toy by ID
            if (req.query.id) {
                const id = req.query.id;
                const query = { _id: new ObjectId(id) };
                const result = await animalToyCollection.findOne(query);
                return res.send(result);
            }
            //send user added toys only
            else if (req.query.email) {
                const query = { sellerEmail: req.query.email };
                let options = {};
                if(req.query.sort && (req.query.sort == 1 || req.query.sort == -1)){
                    options = {
                        sort: { price: req.query.sort}
                    }
                }
                const result = await animalToyCollection.find(query, options).toArray();
                return res.send(result);
            }
            //send number of total toys
            else if(req.query.length === 'true'){
                const length = await animalToyCollection.countDocuments();
                return res.send({length});
            }
            //send toys matched with a given name
            else if(req.query.search){
                const query = { toyName: { $regex: req.query.search, $options: 'i'}}
                const result = await animalToyCollection.find(query).toArray() || [];
                return res.send(result);
            }
            //send all toys for a sub-category
            else if(req.query.subCategory){
                console.log(req.query.subCategory)
                const query = { subCategory: { $regex: req.query.subCategory, $options: 'i'}};
                const result = await animalToyCollection.find(query).toArray() || [];
                return res.send(result);
            }
            //pagination. send 10 toys data by default
            else{
                const page = parseInt(req.query.page) || 0;
                const limit = parseInt(req.query.limit) || 10;
                const skip = page * limit;
                const result = await animalToyCollection.find().skip(skip).limit(limit).toArray();
                res.send(result);
            }
        })

        //add a toy
        app.post('/animal-toys', async (req, res) => {
            const newToy = req.body;
            const previousTotal = await animalToyCollection.countDocuments();
            newToy.id = `animal-toys-0${previousTotal+1}`;
            const result = await animalToyCollection.insertOne(newToy);
            res.send(result);
        })

        //update a specific toy data
        app.put('/animal-toys/:id', async (req, res) => {
            const id = req.params.id;
            const updatedToy = req.body;
            const filter = { _id: new ObjectId(id)};
            const options = { upsert: true };
            const result = await animalToyCollection.updateOne(filter, {$set: updatedToy}, options);
            res.send(result);
        })

        //delete a specific toy
        app.delete('/animal-toys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id)};
            const result = await animalToyCollection.deleteOne(query);
            res.send(result);
        })

        //send all pictures
        app.get('/animal-toys/gallery', async (req, res) => {
            const result = await animalToyCollection.find().toArray();
            const gallery = result.map(item => {
                const data = {
                    _id: item._id,
                    picture: item.picture
                }
                return data;
            })
            res.send(gallery)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
        // console.log('connection closed');
    }
}
run().catch(console.dir);





app.listen(port, () => console.log(`PlayTime server has been started at port: ${port}`))