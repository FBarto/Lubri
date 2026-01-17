
const bcrypt = require('bcryptjs');

async function main() {
    const hash = '$2b$10$mTlqlJuKbq/baQ/uO6OtUuqqylos/4NW5G5yDVx1Zjer9AUGimQse';
    const pass = 'admin123';
    const match = await bcrypt.compare(pass, hash);
    console.log(`Password '${pass}' matches hash? ${match}`);

    // Generate a new hash to be sure
    const newHash = await bcrypt.hash(pass, 10);
    console.log(`New hash for '${pass}': ${newHash}`);
}

main();
