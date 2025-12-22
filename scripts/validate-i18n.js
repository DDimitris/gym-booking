const fs=require('fs');
const path=require('path');
['en.json','el.json'].forEach(fn=>{
  const p=path.join('frontend','src','assets','i18n',fn);
  try{
    const s=fs.readFileSync(p,'utf8');
    JSON.parse(s);
    console.log(fn, 'OK');
  }catch(e){
    console.error(fn, 'ERROR:', e.message);
    process.exitCode=1;
  }
});
