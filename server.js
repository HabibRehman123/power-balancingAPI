const express = require('express');
const bodyParser= require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();

const server = http.createServer(app);

const io = socketIo(server);

app.use(bodyParser.json());
app.use(cors());

const database = {
    users:[
        {
            id: '123',
            name: 'John',
            email: 'john@gmail.com',
            password: 'cookies',
            isrelayon: false,
            totalpowerused:0,
            powerlimit: '20',
            currentpower: 0,
            currentPowerGraph:'',
            allowedenergy: 0.5,
            joined: new Date(),
        },
        {
            id: '124',
            name: 'Sally',
            email: 'sally@gmail.com',
            password: 'bananas',
            isrelayon: false,
            totalpowerused: 0,
            powerlimit: '5',
            currentpower: 0,
            currentpowerGraph:'',
            allowedenergy: 50,
            joined: new Date(),
        }
    ]
}

app.get('/', (req, res) => {
    res.send(database.users);
})

app.post('/signin', (req,res) => {
   if(req.body.email === database.users[0].email 
    && req.body.password === database.users[0].password) {
        res.json(database.users[0]);
    }
    else if(req.body.email === database.users[1].email 
        && req.body.password === database.users[1].password) {
            res.json(database.users[1]);
        }
     else {
        res.status(400).json("error logging in");
    }
})

app.post('/register', (req,res) => {
    const {name, email, password} = req.body;
    bcrypt.hash(password, null, null, function(err, hash) {
        console.log(hash);
        // Store hash in your password DB.
    });
    
    database.users.push({
        id: '125',
        name: name,
        email: email,
        isrelayon:false,
        totalpowerused:0,
        powerlimit: '20',
        currentpower: 0,
        currentpowerGraph:'',
        allowedenergy: 50,
        joined: new Date(),
    })
    res.json(database.users[database.users.length-1]);
})

app.post('/balancedPower', (req, res) => {
    const {balancedPower, id} = req.body;
    let found = false;
    database.users.forEach(user => {
        if(id === user.id){
            user.powerlimit = balancedPower;
            x = balancedPower;
            io.emit("relay", x);
            found = true;
            // sendBalancedPower(x);
            return res.json(user.powerlimit);
        }
    })
    if (!found){
        return res.status(400).json('error sending data');
    }
})

app.post('/getPower',(req,res)=> {
    const {id} = req.body;
    let found = false;
    database.users.forEach(user => {
        if(id === user.id){
            getCurrentPower(user.id);
            found = true;
            return res.json(user);
        }
    })
    if (!found){
        return res.status(400).json('error sending data')
    }
})

app.post('/getPowerGraph',(req,res)=> {
    const {id} = req.body;
    let found = false;
    database.users.forEach(user => {
        if(id === user.id){
            getCurrentPower2(user.id);
            found = true;
            return res.json(user);
        }
    })
    if (!found){
        return res.status(400).json('error sending data')
    }
})


app.post('/updatePower', (req,res) => {
    const {id, totalpowerused} = req.body;
    let found = false;
    database.users.forEach(user => {
        if(id === user.id){
            found = true;
            user.totalpowerused= totalpowerused;
            return res.json('Power Updated')
        }})
        if(!found){
            return res.status(400).json('error sending data')
        }
})

app.post('/switchRelay', (req, res) => {
    const {id} = req.body;
    let found = false;
    database.users.forEach(user => {
        if(id === user.id){
            io.emit("relay", "switch Relay");
            user.isrelayon= !user.isrelayon;
            return res.json('Relay Switched')
        }})
    if(!found){
        return res.status(400).json('error sending data')
    }
})

app.get('/profile/:id', (req,res) => {
    const {id} = req.params;
    let found = false;
    database.users.forEach(user => {
        if(user.id === id){
            found= true;
            return res.json(user); 
        }
    })
    if(!found){
        res.status(400).json("not found");
    }
})

server.listen(8000);

//gets current power from python
getCurrentPower = (id) => {
    console.log('getCurrentPower called');
    io.emit("power", id)
}

getCurrentPower2 = (id) => {
    console.log('getCurrentPower2 called');
    io.emit("power2", id)
}

//sets current power to database
setCurrentPower = (data) => {
    id = data.id;
    currentPower= data.power;
    console.log('setcurrentPower called');
    console.log(data);
    database.users.forEach(user => {
        if(user.id === id){
            user.currentpower = currentPower;
            // user.totalPowerUsed = user.totalPowerUsed + currentPower;
        }
    })
}

setCurrentPower2 = (data) => {
    id = data.id;
    currentPowerGraph = data.power;
    console.log('setcurrentPower2 called');
    console.log(data);
    database.users.forEach(user => {
        if(user.id === id){
            user.currentPowerGraph = currentPowerGraph;
        }
    })
}

//socket communication functionality
io.on("connection", function(socket) {
    console.log("socket.io connected " + socket.id);

    socket.on("something", function(data) {
    console.log("Received something");
    console.log(data);
    })

    socket.on("power", function(data){
        console.log("power value received");
        console.log(data.power, data.id);
        setCurrentPower(data);
    })
    
    socket.on("power2", function(data){
        console.log("power value received");
        console.log(data.power, data.id);
        setCurrentPower2(data);
    })

    socket.on("message", function(data) {
    console.log("Received message");
    console.log(data);
    })
})

