import plist from "simple-plist";

// // Convert a Javascript object to a plist xml string
// var xml = plist.stringify({ name: 'Joe', answer: 42 })
// console.log(xml) // output is a valid plist xml string

// // Convert a plist xml string or a binary plist buffer to a Javascript object
// var data = plist.parse(
//   '<plist><dict><key>name</key><string>Joe</string></dict></plist>'
// )
// console.log(JSON.stringify(data));

if (process.argv.length !== 3) {
    console.log("Pass a file!");
    process.exit(1);
}

const data = plist.readFileSync(process.argv[2]);
console.log(JSON.stringify(data))