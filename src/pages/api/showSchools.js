import { getConnection } from '../../../lib/db'

export default async function handler(req, res) {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query('SELECT id, name, address, city, image FROM schools');

    // Convert BLOB to Base64
  const schoolsWithImages = rows.map(school => ({
    ...school,
    image: school.image 
        ? `data:image/jpeg;base64,${school.image.toString('base64')}`
        : '/placeholder-image.jpg' // Replace with a valid placeholder image
}));


    res.status(200).json(schoolsWithImages);
  } catch (error) {
    console.error('Error fetching schools:', error); // Log the error
    res.status(500).json(error);
}

}
