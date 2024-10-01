import React, { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSelector } from "react-redux";

const SignUp = () => {
  const [input, setInput] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const {user} = useSelector(store=>store.auth);
  const navigate = useNavigate();

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const signupHandler = async (e) => {
    e.preventDefault();
    console.log(input);
    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:5000/user/register",
        input,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      if (res.data.success) {
        navigate("/login");
        toast.success(res.data.message);
        setInput({
          username: "",
          email: "",
          password: "",
        });
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{
    if(user){
        navigate("/");
    }
},[])

  return (
    <div className="flex items-center w-screen h-screen justify-center">
      <form
        onSubmit={signupHandler}
        className="shadow-lg flex flex-col gap-5 p-8"
      >
        <div>
          <h1 className="text-center font-bold text-xl text-blue-700">
            SignUp
          </h1>
          <br />
          <p className="text-sm text-center">
            {" "}
            Sign up today to unlock a window into the moments shared by your
            <br />
            friends—captured in vibrant photos and videos.
          </p>
        </div>
        <div>
          <span className="font-medium">Username</span>
          <Input
            type="text"
            placeholder="Enter your username"
            name="username"
            value={input.username}
            onChange={changeEventHandler}
            className="focus-visible:ring-transparent my-2"
          />
        </div>
        <div>
          <span className="font-medium">Email</span>
          <Input
            type="email"
            placeholder="Enter your email"
            name="email"
            value={input.email}
            onChange={changeEventHandler}
            className="focus-visible:ring-transparent my-2"
          />
        </div>
        <div>
          <span className="font-medium">Password</span>
          <Input
            type="password"
            placeholder="Enter your password"
            name="password"
            value={input.password}
            onChange={changeEventHandler}
            className="focus-visible:ring-transparent my-2"
          />
        </div>
        {loading ? (
          <Button>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Please wait
          </Button>
        ) : (
          <Button
            type="submit"
            className="
            bg-blue-500  
            hover:bg-sky-600 
            active:bg-sky-700 focus:outline-none focus:ring 
            focus:ring-sky-300"
          >
            Signup
          </Button>
        )}
        <span className="text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 underline">
            Login
          </Link>
        </span>
      </form>
    </div>
  );
};

export default SignUp;
