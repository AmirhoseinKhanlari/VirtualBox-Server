var virtualbox = require('virtualbox');
var app = require('../app')
var SSH = require('simple-ssh');
const jwt = require('jsonwebtoken');
const {exec} = require('child_process');
let username = '';
exports.checkPrivileges = (req,res,next) => {
    const {token} = req.body;
    jwt.verify(token,process.env.JWT_SECRET,(err,user)=> {
        console.log(err)
        if (err) return res.sendStatus(403);
        username = user.id;
        next();
    })
}
exports.getCommand = (req,res,next) => {
    const body = req.body
    const response = res
    console.log(username)
    let {vmName,sourceVmName,command} = req.body;
    if(!sourceVmName) sourceVmName = "VM1"; 
     if(username === 'user1' && (vmName!== 'VM1' || sourceVmName!=='VM1' || command ==='transfer')) {
        return res.status(400).json({
            status:"fail",
            message:"User1 can only interact with VM1!" 
        }); 
        }
    if(req.body.command === "status"){  
        getStatus(body,res) 
    }
    if(req.body.command === "on"){
        powerOn(body,res)
    }
    if(req.body.command === "off"){
        powerOff(body,res)
    }
    if(req.body.command === "clone"){
        clone(body,res)
    }
    if(req.body.command === "execute"){
        execute(body,res)
    }
    if(req.body.command === "setting"){
        setting(body,res)
    }
    if(req.body.command === "delete"){
        deleteVM(body,res)
    }
    if(req.body.command === "transfer"){
        transferFile(body,res)
    }
    if(req.body.command === "copyToVM"){
        copyToVM(body,res)
    } 
}

const getStatus = (req,res) => {
    const vmName = req.vmName;
    if(!req.vmName){
            details:virtualbox.list((list_data,err)=> {
                if(err) throw err
                if (list_data) {
                    res.status(200).json({
                        command:"status",
                        details:list_data
                    })
                  }
            })



    }else {
        virtualbox.isRunning(vmName, function (error, isRunning) {
            if (error) {
              throw error;
            }
            if (isRunning) {
              console.log('Virtual Machine "%s" is Running', vmName);
            } else {
              console.log('Virtual Machine "%s" is Poweroff', vmName);
            }
        })
        virtualbox.isRunning(vmName,(error,isRunning) => {
            if(error) throw error;
            if(isRunning){
                res.status(200).json({
                    command:'status',
                    vmName:vmName, 
                    status:"On"
                })

            } 
            else {
                res.status(200).json({
                    command:'status',
                    vmName:vmName,
                    status:"Off"
                })
            }

        })


    
    }}
const powerOn = (req,res) => {
    const vmName = req.vmName;
    virtualbox.isRunning(vmName,(error,isRunning)=>{
        if(error) throw error;
        if(isRunning){
            res.status(200).json({
                command:"on",
                status:`${vmName} is already running!`
            })
        }else {
            virtualbox.start(vmName,(error)=> {
                if(error) throw error;
                res.status(200).json({
                    command:"on",
                    vmName,
                    status:"Powering on"
                })
            })
        }
    })


}
const powerOff = (req,res) => {
    const vmName = req.vmName;
    virtualbox.isRunning(vmName,(error,isRunning)=>{
        if(error) throw error;
        if(!isRunning){
            res.status(200).json({
                command:"off",
                status:`${vmName} is already off!`
            })
        }else {
            virtualbox.poweroff(vmName,(error)=> {
                if(error) throw error;
                res.status(200).json({
                    command:"off",
                    vmName,
                    status:"Powering off"
                })
            })
        }
    })
}
const clone = (req,res) =>{
    const sourceVmName = req.sourceVmName;
    const destVmName = req.destVmName;
    virtualbox.clone(sourceVmName, destVmName,(error)=> {
        if (error) throw error;
        console.log('Done!');
        res.status(200).json({
            command:"clone",
            sourceVMName:sourceVmName,
            destVmName:destVmName,
            status:"OK"
        })
      });
}
const execute = (req,res) => {
    const vmName = req.vmName
    const command = req.input
    let ipAddress;
    exec(`VBoxManage guestproperty get ${vmName} "/VirtualBox/GuestInfo/Net/0/V4/IP"`,(err,stdout,stderr) => {
        if(err) {
            throw err;
            return;
        }
        ipAddress = stdout.split(':')[1].trim();
        console.log(ipAddress)
        var ssh = new SSH({
            host: ipAddress,
            user: 'amirkh',
            pass: 'Amir1377'
        });
        ssh.exec(`${command}`, {
            out: function(stdout) {
                res.status(200).json({
                    command:"execute",
                    vmName,
                    status:"OK",
                    response:stdout
                })
            }
        }).start();

    })


}
const setting = (req,res) => {
    const vmName= req.vmName
    console.log(vmName)
    if(req.cpu && req.ram){
        virtualbox.modify(vmName,{
            memory:Number(req.ram),
            cpus:Number(req.cpu)
        },(error)=>{
            if(error) throw error
        })
        res.status(200).json({
            command:"setting",
            vmName,
            cpu:req.cpu,
            ram:req.ram,
            status:"OK"

        })
    }

}
const deleteVM = (req,res) => {
    const vmName = req.vmName
    exec(`vboxmanage unregistervm ${vmName} --delete`,(err,stdout,stderr) => {
        if(err) {

            throw err;
            return;
        }
        res.status(200).json({
            command:"delete",
            vmName,
            status:"OK"
        })
    })

}
const transferFile = (req,res) => {
    const originVm = req.originVm
    const originPath = req.originPath
    const destVM = req.destVM
    const destPath = req.destPath
    let filename = originPath.split('/');
    filename = filename[filename.length-1];
    console.log(filename)
    exec(`vboxmanage guestcontrol ${originVm} copyfrom ${originPath} /Users/amirhoseinkhanlari/Downloads/${filename} --username amirkh --password Amir1377`,(err,stdout,stderr) => {
        if(err) {
            throw err; 
            return;
        }
        exec(`vboxmanage guestcontrol ${destVM} copyto /Users/amirhoseinkhanlari/Downloads/${filename} ${destPath} --username amirkh --password Amir1377`, (err,stdoutt,stderr) => {
                res.status(200).json({
                    command:"transfer",
                    originVm,
                    originPath,  
                    destPath,
                    status:"OK"
                })

    })
})
}
const copyToVM = (req,res) => {
    const originPath = req.originPath
    const destVM = req.destVM
    const destPath = req.destPath
    exec(`vboxmanage guestcontrol ${destVM} copyto ${originPath} ${destPath} --username amirkh --password Amir1377`, (err,stdoutt,stderr) => {
        if(err){
            throw err;
            return;
        }
        res.status(200).json({
            command:"copyToVM",
            originPath,  
            destVM,
            destPath,
            status:"OK"
        })
    })
}
    

