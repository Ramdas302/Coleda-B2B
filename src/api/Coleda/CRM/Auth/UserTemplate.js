const express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
var passport = require("passport");
var userSchema = require("../../../../../app/models/Users");
var UserModel = mongoose.model("user");
var jwt = require("jsonwebtoken");
var nodemailer = require("nodemailer");
var crypto =require("crypto");
var async =require("async");
const { domain } =('frontEnd');
const sgMail = require('@sendgrid/mail')
var fs = require("fs");
const csv=require('csvtojson')
const multer = require('multer');
var pdf = require('html-pdf');
const path = require("path");
const excel = require("exceljs");

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


router.post('/sign-up', function(req, res) {
    UserModel.register(new UserModel({ 
      username: req.body.username,
      Email:req.body.Email,
     }),
      req.body.password, function(err, account) {
      if (err) {
        console.log(err)
      }
      passport.authenticate('local')(req, res, function () {
        return res.status(200).json({
          status: 'Registration successful!'
        });
      });
    });
  });

  
router.post('/user-signup', function(req, res) {
  UserModel.register(new UserModel({ 
    username: req.body.username,
    Email:req.body.Email,
    FullName:req.body.Fullname,
    Phone_No:req.body.Phone_No,
    City:req.body.City}),
    req.body.password, function(err, account) {
    if (err) {
      return res.status(500).json({
        err: err
      });
    }
    passport.authenticate('local')(req, res, function () {
    });
    async.waterfall([
        function(done) {
          crypto.randomBytes(20, function(err, buf) {
            var token = buf.toString('hex');
            done(err, token);
          });
        },
        function(token, done) {
          UserModel.findOne({ Email: req.body.Email}, function(err, user) {
            if (!user) {
              req.json('No account with that email address exists.');
              
            }
    
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
            user.save(function(err) {
              done(err, token, user);
            });
          });
        },
        function sendEmail(token, user, done) {
        
  
          const sendGridAPIKey = "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"
        
           sgMail.setApiKey(sendGridAPIKey)
        
            const msg = {
           to: user.Email,
           from: 'jadhavramdas655@gmail.com',
           subject:'forgot password ',
           text:  'your username and password create of admin ' + user.username + ' now change your password plase click the link.\n' + 'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
           'http://leadmanagement.dataversityit.com/#/dashboard/' + token + '\n\n' + 'Hello,\n\n' 
       
           }
        
           sgMail.send(msg).then(() => {
            res.json('Registration successfull')
        }).catch((error) => {
            console.log(error)
        })
              
            
            }
      ], function(err) {
        if (err) return next(err);
        res.json('dssd')
      });
  });
});



router.post("/login", (req, res) => {
  passport.authenticate("local", { session: false }, (err, user) => {
    if (err || !user) {
      return res.status(401).send({
        error: err ? err.message : "Login or password is wrong",
      });
    }
    req.login(user, { session: false }, (error) => {
      if (error) {
        res.send(error);
      }
      let token = jwt.sign(
        {
          Email: user.Email,
          username: user.username,
          userId: user._id,
          role: user.role,
        },
        "authorize",
        {
          expiresIn: "1h",
        }
      );
      return res.send({ user, token });
    });
  })(req, res);
});


router.get("/searchuser/:query", function(req, res){
   UserModel.find({$text: {$search: req.params.query}}).exec(function(err,result){
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


router.get('/logout', function(req, res) {
  req.logout();
  req.session.destroy(()=>{
  res.status(200).json({
    status: 'Bye!'
  });
})
});


router.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        UserModel.findOne({ Email: req.body.Email}, function(err, user) {
          if (!user) {
            req.json('No account with that email address exists.');
            
          }
  
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function sendEmail(token, user, done) {
      

        const sendGridAPIKey = "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"
      
         sgMail.setApiKey(sendGridAPIKey)
      
          const msg = {
         to: user.Email,
         from: 'jadhavramdas655@gmail.com',
         subject:'forgot password ',
         text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://leadmanagement.dataversityit.com/#/dashboard/' + token + '\n\n' + 'Hello,\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
         }
      
         sgMail.send(msg).then(() => {
          res.json('forgot password link sent your EmailId')
      }).catch((error) => {
          console.log(error.response.body)
          // console.log(error.response.body.errors[0].message)
      })
            
          
          }
    ], function(err) {
      if (err) return next(err);
      res.json('dssd')
    });
  });



router.get('/reset/:token', function(req, res) {
  UserModel.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      res.json()
    }
    res.json( {token: req.params.token});
  });
});



router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      UserModel.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          res.json( 'Password reset token is invalid or has expired.');
          
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            ree.json("Passwords do not match.");
        }
      });
    },
    
    function sendEmail( user, done) {
      const sendGridAPIKey = "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"
    
       sgMail.setApiKey(sendGridAPIKey)
    
        const msg = {
       to: user.Email,
       from: 'jadhavramdas655@gmail.com',
       subject: 'Your password has been changed',
       text: 'Hello,\n\n' +
         'This is a confirmation that the password for your account ' + user.username + ' has just been changed.\n'
     };
    
       sgMail.send(msg).then(() => {
        res.json('your password change successfully')
    }).catch((error) => {
      done(error);
        // console.log(error.response.body.errors[0].message)
    })
           
        }
  ], function(err) {
    res.json('not saved');
  });
});

router.get('/getUsers',function(req,res){
  UserModel.find({}).exec(function(err,result){
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

router.put('/updateuser/:id',function(req,res){
  update = {
    $set: {
      username:req.body.username,
      Email:req.body.Email,
      FirstName:req.body.FirstName,
      LastName:req.body.LastName,
      FullName:req.body.FirstName.concat(' ', req.body.LastName),
      Phone_No:req.body.Phone_No,
      City:req.body.City

    }
  };
  UserModel.findByIdAndUpdate(req.params.id,update, function (err, Users) {
      if (err) {
        console.error("err"+err)
        return res.status(400).json({
          message: 'Bad Request'
        });
      } else {
        res.json({
          status: 200,
          data: Users
        })
      }

    });
});


router.post('/deleteUsers/:id',async(req,res)=>{
  var deletedata = await UserModel.findByIdAndRemove(req.params.id)
  if (deletedata) {
    res.json({
      status:200,
      data:deletedata 
    })
  }else{
   console.error(err);
   return res.status(400).json({
     message: 'Bad Request'
  }); 
  }
})

router.post('/changepassword', function(req, res) {
  UserModel.findById({_id:req.body.id},(err, user) => {
    if (err) {
      res.json({ success: false, message: err }); 
    } else {
      if (!user) {
        res.json({ success: false, message: 'User not found' }); 
      } else {
        user.changePassword(req.body.oldpassword, req.body.newpassword, function(err) {
           if(err) {
          if(err.name === 'IncorrectPasswordError'){
            res.json({ success: false, message: 'Incorrect password' }); 
          }else {
            res.json({ success: false, message: 'Something went wrong!! Please try again after sometimes.' });
                    }
          } else {
            res.json({ success: true, message: 'Your password has been changed successfully' });
           }
         })
      }
    }
  }); 
});


router.get("/userPdfdownload", function (req, res) {
  UserModel.find({}).exec(function (err, contacts) {
    if (err) throw err;
    const jsoncontacts = JSON.parse(JSON.stringify(contacts));

    var result = jsoncontacts;    
var table 
table += "<table border='1' style='width:100%;word-break:break-word;'>";
table += "<tr > Contacts";
table += "<th >Id</th>";
table += "<th >username";
table += "<th >Email_ID";
table += "<th >FullName";
table += "<th >Phone_No";
table += "<th >City";

table += "</tr>";
result.forEach(function(row){
  table += "<tr>";
  table += "<td>"+row._id+"</td>";
  table += "<td>"+row.username+"</td>";
  table += "<td>"+row.Email_ID+"</td>";
  table += "<td>"+row.FullName+"</td>";
  table += "<td>"+row.Phone_No+"</td>";
  table += "<td>"+row.City+"</td>";

  table += "</tr>";
});
table += "</table>";
var options = {
"format": "A4",
"orientation": "landscape",
"border": {
  "top": "0.1in",
},
"timeout": "120000"
};

pdf.create(table, options).toFile('public/Users.pdf', function(err, result) {
if (err) return console.log(err);
res.download('public/Users.pdf');
});
});
});


router.get('/userExceldownload', function (req, res) {
  UserModel.find({}).exec(function(err,Users){
    if(err){
      console.error(err);
    }else{
     
      let workbook = new excel.Workbook();
      let worksheet = workbook.addWorksheet('Users'); 
      
      //  WorkSheet Header
      worksheet.columns = [
        // { header: 'Id', key: '_id', width: 30 },
        { header: 'username', key: 'username', width: 30 },
        { header: 'Email_ID', key: 'Email_ID', width: 30},
        { header: 'FullName', key: 'FullName', width: 30},
        { header: 'Phone_No', key: 'Phone_No', width: 30},
        { header: 'City', key: 'City', width: 30 },
       
      ];
      
      for (const row of Users) {
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

  const balDue = worksheet.getColumn('Email_ID')
  balDue.eachCell((cell, rowNumber) => {
      if (cell.value >= 'B1'  ) {
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
        "attachment; filename=" + `Users_${Date.now()}.xlsx`
      );

      return workbook.xlsx.write(res).then(function () {
        res.status(200).end();
      });
    }
      });
    
});

module.exports = router;
