const app = require('./app');
const dotenv = require('dotenv');
const port = 8000;
dotenv.config({ path: './config.env' });
app.listen(port, () =>{
    console.log(`VirtualBox Server running on port ${port}`);
})

   