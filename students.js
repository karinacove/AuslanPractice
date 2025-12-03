// students.js
const classData = {
  "PA": ["Ava Y","Axel M","Devin S","Eden M","Elayna M","Elvis H","Georgia J","Harry D","Harvey P","Indy B","Jai T","Lachie H","Livie P","Mack S","Mason C","Narvi C","Shireen I","Stella H"],
  "PH": ["Aiden S","Annabelle B","Casey S","Claudia B","Corbin H","Emily B","Hazel H","Henley L","Hunter K","Isabelle L","Ivy P","Izzy P","Jagger S","Madison D","Mason K","Max C","Remi H"],
  "PM": ["Archie D","Ashton S","Blake H","Bodhi W","Clay M","Connor B","Emilia P","Leah D","Mackenzie O","Mila G","Ollie B","Reign R","Rhylee K","Summer J","Tayah G","Toby F","Valentina G","Zayne K"],
  "PY": ["Callum G","Drew M","Eli P","Elsie N","Frankie C","Hannah H","Hudson W","Indy L","Kai C","Kyson G","Leo R","Levon S","Luke P","Rhys B","Ruby T","Sam A","Treasure R","Wynter D"],  
  "12B": ["Alice B","Anya T","Boston R","Buvindu W","Charlie B","Charlie H","Charlie P","Charlotte D","Charlotte R","Cooper P","Elara S","Ella B","Everest O","Hamish C","Isabelle R","Isla H","Jack M","Leni S","Marli J","Matilda D","Shelby T","Stevie H","Tate L","Zaviyar K"],
  "12F": ["Andie A","Archer M","Ashton L","Ashton W","David L","Evelyn P","Harper B","Harper S","Jayde H","Kenzi J","Kenzie R","Layla D","Leo C","Levi DE","Lucy M","Maddox M","Noah B","Olivia D","Patrick H","Petra B","Quinn C","Serena M","Sophie BL","Sophie BR"], 
  "12K": ["Alonzo I","Archana H","Archie S","Ella B","Ella M","Ellie T","Hayley G","Irini A","Isaac D","Isabelle F","Jackson H","Jayden P","Jude M","Lexy F","Liberty F","Lucy V","Mason C","Maya H","Mia S","Rebekah A","Ruby M","Seth D"],
  "12PW": ["Adelind M","Aidan M","Aisha W","Anastasia S","Brianna B","Charli H","Connor B","Dhyana P","Isabelle H","Ivy C","Jack F","Jett B","Kai W","Kate M","Lachie P","Mason L","Oliver S","Riley B","Shranaav S","Sienna P","Sophia M","Taya G","Thomas S","Willow B"],  
  "12T": ["Aaliyah L","Aaliyah S","Billy Y","Blaze S","Brodie J","Chloe S","Eve H","Frankie H","Harper H","Hudson D","Hugo M","Isla H","Jaxon R","Luca B","Macey M","Patrick A","Peyton W","Piper T","Poppy F","Ryder B","Sophie R","Taylor C","Tyler S"],
  "34F": ["Aisling G","Alarah P","Aria H","Aria T","Bella S","Darcy P","Eason W","Eloise B","Ezra T","Jayce M","Kaylee W","Levi V","Lily R","Mason M","Matilda C","Noah R","Oliver C","Rachel J","River O","Sam M"],
  "34H": ["Aiya T","Chelsea M","Chelsey S","Chloe B","Darcy H","Esther O","Hudson W","Jack C","Jack P","Jordyn B","Kobe R","Logan V","Makaylah V","Olly J","Piper F","Ryder C","Ryder T","Siena W","Sophia C","Sophie L","Vihaan P"],
  "34M": ["Alisha M","Asha E","Daani R","Daisy W","Elijah M","Emerson F","Harvey C","Jack V","Joshua D","Kaleesha W","Lexi C","Luca C","Nathan C","Poppy G","Sofia D","Tyson B","Udhayan S","William M","Xanthe B"], 
  "34P": ["Hudson D","Amer I","Ari H","Audrey C","Austin B","Ava D","Brady M","Cedar L","Cooper H","Corey B","Everly B","Heer P","Iliana M","Isabella X","Lucas R","Morgan B","Nikita S","Presica C","Sahib S","Tiahna B","Xavier H"],
  "34R": ["Alessio B","Angus F","Asha D","Audrey C","Ava G","Emma S","Hartley J","Hudson B","Hudson B","Isla T","Isla Y","Macey H","Noah T","Oliver S","Remy H","Rex O","Riley H","Sophie F","Stella P","Zac K"],  
  "56B": ["Alex H","Arden H","Braxton P","Brodie C","Dylan C","Ella G","Ellie C","Evie H","Hamish Y","Jacqueline S","Kayleigh P","Lieven V","Logan C","Logan S","Lucas B","Maddie M","Marie-Claire I","Max C","Mia P","Pavan S","Phoenix L","Ryder M","Shaarav S","Sofia D","Tanah B"],
  "56E": ["Alicia B","Amelia H","Ava B","Beau M","Charis C","Charlee A","Charlotte N","Delilah M","Ivy P","Jack T","Kaelan P","Kobi O","Mae M","Matthew C","Max F","Michael V","Mila B","Nate G","Reggie T","Rhys L","Tatum G","Xander M","Zander M","Zoe G"],
  "56K": ["Aiden N","Alira B","Amelia T","Bowie H","Declan C","Elliott M","Emilia S","Hurricane B","Jade M","James H","Jayce M","Kelina H","Khaleesi B","Lachlan W","Marlie H","Mason M","Max H","Mishal K","Oliver W","Ryan J","Ryder V","Summer W","Zach M"],
  "56R": ["Aaron B","Agam R","Amber M","Amelia S","April M","Benji K","Blair V","Briley C","Corey F","Eva L","Heath D","Hollie T","Isla P","Jaxon C","Jaxon T","Koa P","Michael C","Pearl G","Peyton C","Ryan M","Silas K","Tama K","Tatum S","Violet R"],
  "56S": ["Audrey A","Brooklyn F","Chloe M","Cooper W","Darcy W","Ethan S","Finley W","Flynn R","Harper S","Indie D","Isaac T","Jayme B","Joaquin C","Lily R","Lucy B","Nate M","Noah L","Parker B","Piper S","Seth H","Sophie L","Summer F","Tyler P","Tyler T","Winter A-B"]
};

// roles for home login
const homeRoles = ["Parent", "Teacher", "Sibling", "Visitor"];
