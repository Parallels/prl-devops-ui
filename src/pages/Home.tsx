
import { useState } from "react";
import reactLogo from "../assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "../controls";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

export const Home: React.FC = () => {
    const [greetMsg, setGreetMsg] = useState("");
    const [name, setName] = useState("");
    const navigate = useNavigate();

    async function greet() {
        // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
        setGreetMsg(await invoke("greet", { name }));
    }

    async function callAPI() {
        try {
            const token = await authService.getAccessToken('localhost');
            console.log("Token retrieved successfully");
        } catch (error) {
            console.error("Authentication failed:", error);
        }
    }

    return (
        <div className="flex w-full h-full flex-col items-center justify-center pt-[10vh] text-center">
            <h1 className="text-4xl font-bold mb-8">Welcome to Tauri + React</h1>

            <div className="flex justify-center gap-8 mb-8">
                <a href="https://vite.dev" target="_blank" className="hover:scale-110 transition-transform duration-700">
                    <img src="/vite.svg" className="h-24 p-6 hover:drop-shadow-[0_0_2em_#747bff]" alt="Vite logo" />
                </a>
                <a href="https://tauri.app" target="_blank" className="hover:scale-110 transition-transform duration-700">
                    <img src="/tauri.svg" className="h-24 p-6 hover:drop-shadow-[0_0_2em_#24c8db]" alt="Tauri logo" />
                </a>
                <a href="https://react.dev" target="_blank" className="hover:scale-110 transition-transform duration-700">
                    <img src={reactLogo} className="h-24 p-6 hover:drop-shadow-[0_0_2em_#61dafb]" alt="React logo" />
                </a>
            </div>
            <p className="mb-8">Click on the Tauri, Vite, and React logos to learn more.</p>

            <form
                className="flex justify-center gap-2 mb-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    greet();
                }}
            >
                <input
                    id="greet-input"
                    className="rounded-lg border border-transparent px-4 py-2 bg-white text-black dark:bg-[#0f0f0f98] dark:text-white shadow-md focus:outline-none focus:ring-2 focus:ring-[#646cff]"
                    onChange={(e) => setName(e.currentTarget.value)}
                    placeholder="Enter a name..."
                />
                <Button
                    variant="outline"
                    color="blue"
                    type="submit"
                    onClick={() => void greet()}
                >
                    Greet
                </Button>
            </form>
            <p className="mb-8">{greetMsg}</p>

            <Button
                variant="solid"
                color="indigo"
                onClick={() => navigate('/ux-demo')}
            >
                Go to UX Demo
            </Button>
            <Button
                variant="solid"
                color="indigo"
                onClick={() => void callAPI()}
            >
                Call API
            </Button>
        </div>
    );
};
