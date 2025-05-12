import CustomGrid from "@/components/home/CustomGrid";
import GridPage from "@/components/home/GridPage";
import Sidebar from "@/components/sidebar/Sidebar";

const Home = async () => {
  
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-full flex flex-col items-end">
        <Sidebar />

        <div className="w-[calc(100%-275px)] min-h-screen flex flex-col justify-center items-center bg-gray-100">
          <GridPage />
        </div>
      </div>
    </div>
  );
};

export default Home;
