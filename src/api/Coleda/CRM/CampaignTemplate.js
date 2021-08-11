const express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const path = require("path");
const excel = require("exceljs");
const multer = require('multer');
const csv=require('csvtojson')
var fs = require("fs");
var pdf = require('html-pdf');
const moment = require('moment');
var CampaignSchema = require("../../../../app/models/Campiagn");
var CampaignModel = mongoose.model("campaign");


let upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      let type = req.params.type;
      let path = `./uploads`;
      callback(null, path);
    },
    filename: (req, file, callback) => {
      callback(null, file.originalname,file.fieldname);
    }
  })
});


 router.post('/uploadfile', upload.single("uploadfile"), (req, res) =>{
  importCsvData2MongoDB('./uploads/' + req.file.filename);
  res.json({
      'msg': 'File uploaded/import succesfully!', 'file': req.file
  });
});

function importCsvData2MongoDB(filePath){
  csv()
      .fromFile(filePath)
      .then((jsonObj)=>{
          console.log(jsonObj);
          CampaignModel.insertMany(jsonObj, (err, res) => {
                 if (err) throw err; 
              });
    
          fs.unlinkSync(filePath);
      })
}



router.post('/addCampaign',function(req,res){
   var time = moment(new Date()).format("DD-MM-YYYY")
    var addCampaign = new CampaignModel({
        userId:req.body.userId,
        Campaign_Name:req.body.Campaign_Name,
        Campaign_Type:req.body.Campaign_Type,
        Geo:req.body.Geo,
        Campaign_Status:req.body.Campaign_Status,
        Job_Titles:req.body.Job_Titles,
        Employee_Size:req.body.Employee_Size,
        Industry_Type:req.body.Industry_Type,
        Revenue:req.body.Revenue,
        Allocation:req.body.Allocation,
        createdAt:time
    });
    addCampaign.save(function (err, result) {
      if (err) {
        console.error(err);
        return res.status(400).json({
          message: 'Bad Request'
        });
      } else {
        res.json({
          status: 200,
          data: result
        })
      }

    });

});

router.get('/getCampaigns/:userId',function(req,res){
    CampaignModel.find({userId:req.body.userId}).exec(function(err,result){
        if(err){
          return res.status(400).json({
            message: 'Bad Request'
          });
        }else{
          res.json({
            status: 200,
            data: result
          });
        }
      
      });
  });
  
 

router.put('/updateCampaigns/:id',function(req,res){
    update = {
      $set: {
        Campaign_Name:req.body.Campaign_Name,
        Campaign_Type:req.body.Campaign_Type,
        Geo:req.body.Geo,
        Campaign_Status:req.body.Campaign_Status,
        Job_Titles:req.body.Job_Titles,
        Employee_Size:req.body.Employee_Size,
        Industry_Type:req.body.Industry_Type,
        Revenue:req.body.Revenue,
        Allocation:req.body.Allocation,
      }
    };
    CampaignModel.findByIdAndUpdate(req.params.id,update, function (err, campaigns) {
        if (err) {
          console.error("err"+err)
          return res.status(400).json({
            message: 'Bad Request'
          });
        } else {
          res.json({
            status: 200,
            data: campaigns
          })
        }
  
      });
  });


  
  
//   router.post("/searchCampaign", function(req, res){
//     CampaignModel.find({Campaign_Name:req.body.Campaign_Name,Campaign_Type:req.body.Campaign_Type}).exec(function(err,Leads){
//         if(err){
//           res.json({
//             status:400,
//             message:"Bad request"
              
//           })
//       }else{
//         res.json({
//           status:200,
//           data:Leads
//         })
//       }
//       })
//     });
    

  router.get("/ActiveCampaigns", async(req, res)=>{
    var Campaigns = await CampaignModel.count({Campaign_Status:"Active"})
    CampaignModel.find({Campaign_Status:"Active"}).exec(function(err,Campaignsdata){   
      if(err){
        res.json({
          status:400,
          message:"Bad request"
            
        })
    }else{
      res.json({
        status:200,
        data:Campaigns,Campaignsdata
      })
    }
    
})
  });

  router.get("/InactiveCampaigns", async(req, res)=>{
    var Campaigns = await CampaignModel.count({Campaign_Status:"Inactive"})
    CampaignModel.find({Campaign_Status:"Inactive"}).exec(function(err,Campaignsdata){
      if(err){
        res.json({
          status:400,
          message:"Bad request"
            
        })
    }else{
      res.json({
        status:200,
        data:Campaigns,Campaignsdata
      })
    }
    })
  });

  router.get("/InProcessCampaign", async(req, res)=>{
    var Campaigns = await CampaignModel.count({Campaign_Status:"In Process"})
    CampaignModel.find({Campaign_Status:"In Process"}).exec(function(err,Campaignsdata){
      if(err){
        res.json({
          status:400,
          message:"Bad request"
            
        })
    }else{
      res.json({
        status:200,
        data:Campaigns,Campaignsdata
      })
    }
    })
  });

  router.get("/RejectedCampaigns", async(req, res)=>{
    var Campaigns = await CampaignModel.count({Campaign_Status:"Rejected"})
    CampaignModel.find({Campaign_Status:"Rejected"}).exec(function(err,Campaignsdata){
      if(err){
        res.json({
          status:400,
          message:"Bad request"
            
        })
    }else{
      res.json({
        status:200,
        data:Campaigns,Campaignsdata
      })
    }
    })
  });



//   router.get("/getCampaigns/:id",(req, res) => {
//     CampaignModel.findById({_id:req.params.id}).exec(function(err,Leads){
//       if(err){
//         res.json({
//           status:400,
//           message:"Bad request"
            
//         })
//     }else{
//       res.json({
//         status:200,
//         data:Leads
//       })
//     }
   
     
//     })
//   });
  
  router.get("/CampaignPdfdownload", function (req, res) {
    CampaignModel.find({}).exec(function (err, Campaigns) {
      if (err) throw err;
      const jsonCampaigns= JSON.parse(JSON.stringify(Campaigns));
  
      var result = jsonCampaigns;    
var table 
table += "<table border='1' style='width:100%;word-break:break-word;'>";
table += "<tr > Campaigns";
table += "<th >Id</th>";
table += "<th >Campaign_Name";
table += "<th >Campaign_Type";
table += "<th >Geo";
table += "<th >Campaign_Status";
table += "<th >Job_Titles";
table += "<th >Employee_Size";
table += "<th >Industry_Type";
table += "<th >Revenue";
table += "<th >Allocation";
table += "<th >createdAt";
table += "</tr>";
result.forEach(function(row){
    table += "<tr>";
    table += "<td>"+row._id+"</td>";
    table += "<td>"+row.Campaign_Name+"</td>";
    table += "<td>"+row.Campaign_Type+"</td>";
    table += "<td>"+row.Geo+"</td>";
    table += "<td>"+row.Campaign_Status+"</td>";
    table += "<td>"+row.Job_Titles+"</td>";
    table += "<td>"+row.Employee_Size+"</td>";
    table += "<td>"+row.Industry_Type+"</td>";
    table += "<td>"+row.Revenue+"</td>";
    table += "<td>"+row.Allocation+"</td>";
    table += "<td>"+row.createdAt+"</td>";
    table += "</tr>";
});
table += "</table>";
var options = {
  "format": "A3",
  "orientation": "landscape",
  "border": {
    "top": "0.1in",
},
"timeout": "120000"
};

pdf.create(table, options).toFile('public/Campaign.pdf', function(err, result) {
  if (err) return console.log(err);
  res.download('public/Campaign.pdf');
});
  });
  });

 
  router.get('/CampaignExceldownload', function (req, res) {
    CampaignModel.find({}).exec(function(err,Campaigns){
      if(err){
        console.error(err);
      }else{
       
        let workbook = new excel.Workbook();
        let worksheet = workbook.addWorksheet('Campaigns'); 
        
        //  WorkSheet Header
        worksheet.columns = [
          // { header: 'Id', key: '_id', width: 30 },
          { header: 'Campaign Name',key: 'Campaign_Name', width: 30},
          { header: 'Campaign Type', key: 'Campaign_Type', width: 30},
          { header: 'Geo', key: 'Geo', width: 30},
          { header: 'Campaign Status', key: 'Campaign_Status', width: 30 },
          { header: 'Job Titles', key: 'Job_Titles', width: 30},
          { header: 'Employee Size', key: 'Employee_Size', width: 30 },
          { header: 'Industry Type', key: 'Industry_Type', width: 30},
          { header: 'Revenue', key: 'Revenue', width: 30},
          { header: 'Allocation', key: 'Allocation', width: 30, outlineLevel: 1},
          { header: 'createdAt', key: 'createdAt', width: 30 }, 
        ];
        
        for (const row of Campaigns) {
        worksheet.addRow(row);
    }
    worksheet.autoFilter = 'A1:G1';


    worksheet.eachRow(function (row, rowNumber) {

        row.eachCell((cell, colNumber) => {
            if (rowNumber == 1) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'f5b914' }
                }
            }
            
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        })
        
        row.commit();
    });

    const balDue = worksheet.getColumn('Campaign_Name')
    balDue.eachCell((cell, rowNumber) => {
        if (cell.value >= 'A1'  ) {
            cell.fill = {
                type: 'gradient',
                gradient: 'angle',
                degree: 0,
                stops: [
                    { position: 0, color: { argb: 'ffffff' } },
                    { position: 0.5, color: { argb: 'cc8188' } },
                    { position: 1, color: { argb: 'fa071e' } }
                ]
            };
        }
    });
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + `Campaign_${Date.now()}.xlsx`
        );

        return workbook.xlsx.write(res).then(function () {
          res.status(200).end();
        });
      }
        });
      
});


router.get("/Campaigns", function(req, res){
    CampaignModel.find({
        createdAt: {
            $gte: req.body.from,
            $lte: req.body.to,
        },
        Campaign_Type:req.body.Campaign_Type
    }).exec(function(err,Campaigns){
      if(err){
        res.json({
          status:400,
          message:"Bad request"
            
        })
    }else{
      res.json({
        status:200,
        data:Campaigns
      })
    }
    })
  });

module.exports = router;
