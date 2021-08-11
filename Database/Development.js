var mongoose = require('mongoose');

url = "mongodb+srv://coledahrmcrm:coleda@123@cluster0.5laat.mongodb.net/Coleda-HRMCRM?retryWrites=true&w=majority"
mongoose.connect(url,{
useNewUrlParser:true,
useCreateIndex:true,
useUnifiedTopology:true,
useFindAndModify:false
}).then(()=>{
console.log('mongodb connected')
}).catch((err)=>{
    console.log('mongodb not connected')
})

module.exports=mongoose;