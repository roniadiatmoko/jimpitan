export default function AdminHome(){
    return (
        <h1 className="text-center">Selamat Datang {localStorage.getItem('fullname')}</h1>
    )
}