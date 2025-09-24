import { homeList, months } from "../config";

export default function DetailRapel({nomorRumah, year, month}){
    return (
        <div className="m-8">
            <h1 className="text-2xl font-bold">Detail Rapel </h1>
            <h2 className="text-green-500"><b>Rumah No. {nomorRumah} - {homeList.find(home => home.nomor === Number(nomorRumah)).nama}</b></h2>
            <h2 className="text-green-500"><b>{months.find(m => m.value === Number(month)).label} {year}</b></h2>

            <div className="mt-5 rounded-xl bg-green-100 w-full h-full">
                <table className="w-full text-center text-lg font-semibold ">
                    <thead> 
                        <tr>
                            <th className="p-2">Tanggal</th>
                            <th className="p-2">Rapel</th>
                        </tr>
                    </thead>
                    <tbody>

                    </tbody>
                </table>
            </div>
        </div>  
    )
}