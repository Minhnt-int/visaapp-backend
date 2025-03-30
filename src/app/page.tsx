import Image from "next/image";
import styles from "./page.module.css";
import ImageUploadForm from "./ImageUploadForm";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
    

        <ImageUploadForm /> {/* Add the image upload form here */}
      </main>
   
    </div>
  );
}