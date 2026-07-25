import ScanLabel from "./ScanLabel.jsx";
import TagPicker from "./TagPicker.jsx";

export default function TagSection({ selectedTags, onChange }) {
  return (
    <div>
      <ScanLabel text="Categoria e tag"/>
      <TagPicker selectedTags={selectedTags} onChange={onChange}/>
    </div>
  );
}
