import { NextPage } from "next/types";
import dynamic from "next/dynamic";

// const DynamicDeliverman = dynamic(() => import("./components/Deliverman"));
const DynamicRutas = dynamic(() => import("./components/Rutas"))

const enrutamiento: NextPage = () => {
    return <> 
            {/* <DynamicDeliverman /> */}
            <DynamicRutas />
           </>;
}

export default enrutamiento;