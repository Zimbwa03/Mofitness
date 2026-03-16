import { fireEvent, render, screen } from "@testing-library/react-native";

import { WellnessForm } from "../components/wellness/WellnessForm";

describe("WellnessForm", () => {
  it("submits the entered wellness values", () => {
    const onSubmit = jest.fn();

    render(<WellnessForm onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByTestId("wellness-sleep-input"), "7.5");
    fireEvent.changeText(screen.getByTestId("wellness-water-input"), "2.0");
    fireEvent.changeText(screen.getByTestId("wellness-stress-input"), "4");
    fireEvent.press(screen.getByText("Neutral"));
    fireEvent.press(screen.getByTestId("wellness-save-button"));

    expect(onSubmit).toHaveBeenCalledWith({
      sleep_hours: 7.5,
      water_liters: 2,
      stress_level: 4,
      mood: "neutral",
    });
  });
});
