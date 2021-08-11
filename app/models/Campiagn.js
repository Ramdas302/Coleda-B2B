var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var CampaignSchema = new Schema({
    Campaign_Name:{type:String,required:true},
    Campaign_Type:{type:String,required:true},
    Geo:{type:String,required:true},
    Campaign_Status:{type:String,required:true},
    Job_Titles:{type:String,required:true},
    Employee_Size:{type:Number,required:true},
    Industry_Type:{type:String,required:true},
    Revenue:{type:String,required:true},
    Allocation:{type:String,required:true},
    createdAt : {type:String},
})
CampaignSchema.index({Campaign_Name: 'text', Campaign_Type: 'text'});
CampaignSchema.index({'$**': 'text'});
mongoose.model('campaign',CampaignSchema);