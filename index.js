const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const { type } = require('express/lib/response');
const { Schema } = mongoose;
const url = process.env.URL
//console.log("aqui deberia ir la url")
//console.log(url)
mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB', error);
});
const UserSchema = new Schema({
  username: {
    type: String,
    required: true
  },
});
const ExerciseSchema = new Schema({
  user_id: {
    type: String,
    required: true
  },
  description: { 
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }

});
//Let's create the models
const User= mongoose.model('User', UserSchema);
const Excercise = mongoose.model('Excercise', ExerciseSchema);




app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true })); // to analize complex objects
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.get('/api/users', async (req, res) =>{
  try {
    const users = await User.find({}).select('-__v')
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({message: error.message})
  }
  
})

app.get('/api/users/:_id/logs', async (req, res) =>{
  try {
    console.log("testing get logs")
    const {from, to, limit} = req.query;
    const user = await User.findById(req.params._id);
    console.log(user);
    if(user){
      //Definimos los filtros primero para las fechas
      let filtrosFechas= {};
      let buscador= {
        user_id: req.params._id,
      }
      if(from){
        filtrosFechas["$gte"] = new Date(from);
        buscador.date= filtrosFechas
      }
      if(to){
        filtrosFechas["$lte"] = new Date(to);
        buscador.date= filtrosFechas
      }

      //buscamos entonces los registros con ese ID
      let exer = await Excercise.find(buscador).select('-user_id').select('-_id').select('-__v').limit(+limit ?? 1000)
      for (let i = 0; i < exer.length; i++){
        let dateF = (exer[i].date).toDateString();
        exer[i]._doc.date = dateF
      }
      return res.status(200).json({
        username: user.username,
        count: exer.length,
        _id: req.params._id,
        log: exer
      })
    }else{
      return res.status(404).json({message: "user not found"})
    }
    
  } catch (error) {
    return res.status(500).json({message: error.message})
  }
})


app.post('/api/users', async (req, res) =>{
  console.log(req.body)
  try {
    console.log("testing post users")
    const nUser = new User({
      username:req.body.username
    }) 
    const cUser = await nUser.save()
    console.log(cUser)
    return res.status(200).json({username:cUser.username, _id: cUser._id})
  } catch (err) {
    console.log("Error at posting users")
    return res.status(500).json({message: err.message})
  }
})

app.post('/api/users/:_id/exercises', async (req, res) =>{
  console.log(req.body);
  console.log(req.params);
  try {
    console.log("testing post excercises")
    const user = await User.findById(req.params._id);
    console.log(user);
    if(user){
      //console.log("Antes de crear el ejercicio")
      if(req.body.date){
        let fecha = new Date(req.body.date).toDateString()
      }else{
        let fecha = new Date().toDateString()
      }
      const nExe = new Excercise({
        user_id:req.params._id,
        description: req.body.description,
        duration: req.body.duration,
        date: fecha
      }) 
      const cExe = await nExe.save()
      //console.log("despues de crearlo")
      console.log(cExe)
      return res.status(200).json({
        _id: cExe.user_id,
        username: user.username,
        description: cExe.description,
        duration: cExe.duration,
        date: new Date(cExe.date).toDateString()
      })
    }else{
      return res.status(404).json({message: "user not found"})
    }

  } catch (err) {
    console.log("Error at posting users")
    return res.status(500).json({message: err.message})
  }
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
  