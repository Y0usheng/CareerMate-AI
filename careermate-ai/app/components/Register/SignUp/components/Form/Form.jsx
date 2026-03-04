import Button from "./components/Button";
import Input from "./components/Input";
import LoginLink from "./components/LoginLink";

const Form = () => (
    <form className="flex-1">
        <Input />
        <Input />
        <Input />
        <Button />
        <LoginLink />
    </form>
)

export default Form;