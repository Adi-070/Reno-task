import Link from 'next/link';


export default function Home() {
  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-3xl font-bold mb-6">School Management System</h1>
      <div className="flex justify-center space-x-6">
        <Link href="/addSchool">
          <p className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Add School
          </p>
        </Link>
        <Link href="/showSchools">
          <p className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            Show Schools
          </p>
        </Link>
      </div>
    </div>
  );
}
