import UserReviews from "./components/UserReviews";
import Advantages from "./components/Advantages";

const Showcase = () =>
    <div className="flex-1 p-8 my-auto">
        <p className="showcase-title">Showcase</p>
        <UserReviews />
        <Advantages />
    </div>;

export default Showcase;