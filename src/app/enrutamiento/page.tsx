import { NextPage } from "next/types";
import dynamic from "next/dynamic";
import Hangman from "./components/Hangman";

const enrutamiento: NextPage = () => {
    return <> 
            {/* <DynamicDeliverman /> */}
            <Hangman />
           </>;
}

export default enrutamiento;