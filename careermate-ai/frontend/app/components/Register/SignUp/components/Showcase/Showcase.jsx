import UserReviews from "./components/UserReviews";
import Advantages from "./components/Advantages";
import SubscribeLink from "./components/SubscribeLink";
import background from "./assets/background.png";
import Image from "next/image";

const Showcase = () =>
    <div className="relative">
        <Image className="absolute" src={background} fill alt="Background" />
        <div className="relative p-8">
            <SubscribeLink />
            <UserReviews />
            <Advantages />
        </div>
    </div>;

export default Showcase;