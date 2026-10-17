import { displayFractions } from "../../lib/displayFractions";
import { scaleIngredient } from "../../lib/scaleIngredient";

export function IngredientList({
  ingredients,
  factor,
}: {
  ingredients: string[];
  factor: number;
}) {
  if (ingredients.length === 0) {
    return (
      <p className="text-body text-muted">
        This recipe doesn&apos;t list its ingredients separately.
      </p>
    );
  }
  return (
    <ul className="text-body flex flex-col">
      {ingredients.map((line, i) => (
        <li key={i} className="py-2 break-words">
          {displayFractions(scaleIngredient(line, factor))}
        </li>
      ))}
    </ul>
  );
}
