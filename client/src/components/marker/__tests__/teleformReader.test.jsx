import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import TeleformReader from "../teleformReader";
import teleformReducer, { setTeleformData } from "../../../store/exam/teleformSlice";
import * as teleformReaderUtil from "../../../utilities/marker/teleformReader";

// Mock the readTeleform utility
jest.mock("../../../utilities/marker/teleformReader", () => ({
  readTeleform: jest.fn()
}));

// Mock TeleformTable component to avoid dependencies on examData
jest.mock("../TeleformTable", () => {
  return function MockTeleformTable({ data }) {
    return (
      <div data-testid="mock-teleform-table">
        <span>Mocked TeleformTable</span>
        <span data-testid="data-length">{data.length}</span>
      </div>
    );
  };
});

// Better mock for antd components
jest.mock("antd", () => {
  const originalModule = jest.requireActual("antd");
  return {
    ...originalModule,
    Upload: ({ beforeUpload, children }) => (
      <div>
        <div 
          data-testid="mock-upload-button" 
          onClick={() => {
            const mockFile = new File(["mock file content"], "mockfile.txt", {
              type: "text/plain"
            });
            beforeUpload(mockFile);
          }}
        >
          {children}
        </div>
      </div>
    ),
    Button: ({ children, disabled, icon, onClick }) => (
      <button 
        onClick={onClick} 
        disabled={disabled}
        data-testid={children === "Clear" ? "clear-button" : undefined}
      >
        {icon && <span>{icon}</span>}
        {children}
      </button>
    ),
    Space: ({ children, style }) => (
      <div style={style}>{children}</div>
    )
  };
});

// Mock the FileReader API
global.FileReader = class {
  constructor() {
    this.onload = jest.fn();
    this.onerror = jest.fn();
  }

  readAsText() {
    // Simulate successful file read
    setTimeout(() => {
      this.onload({ target: { result: "01483316245 VE BODNIHD 11100000004 0108080108010101041602160116161604160808" } });
    }, 0);
  }
};

// Mock window.matchMedia for Ant Design
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe("TeleformReader Component", () => {
  let store;
  const markingKey = { "00000004": "0108080108010101041602160116161604160808" };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock teleform data parser
    teleformReaderUtil.readTeleform.mockImplementation((data) => {
      if (!data) return [];
      return [
        {
          studentId: "483316245",
          lastName: "VE",
          firstName: "BODNIHD",
          versionId: "4",
          answerString: "0108080108010101041602160116161604160808"
        }
      ];
    });

    // Setup Redux store with teleform reducer
    store = configureStore({
      reducer: {
        teleform: teleformReducer
      }
    });
  });

  test("renders with empty state", () => {
    render(
      <Provider store={store}>
        <TeleformReader markingKey={markingKey} />
      </Provider>
    );

    // Check for key UI elements
    expect(screen.getByText("Teleform Data")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter teleform scan data here")).toBeInTheDocument();
    expect(screen.getByText("Load from file")).toBeInTheDocument();
    
    // Check Clear button is disabled when empty
    const clearButton = screen.getByTestId("clear-button");
    expect(clearButton).toBeInTheDocument();
    expect(clearButton).toBeDisabled();
    
    expect(screen.getByText("Mocked TeleformTable")).toBeInTheDocument();
  });

  test("displays teleform data from Redux store", () => {
    // Preload some data in the store
    store.dispatch(setTeleformData("01483316245 VE BODNIHD 11100000004 0108080108010101041602160116161604160808"));

    render(
      <Provider store={store}>
        <TeleformReader markingKey={markingKey} />
      </Provider>
    );

    // Check if the textarea shows the data
    const textarea = screen.getByPlaceholderText("Enter teleform scan data here");
    expect(textarea.value).toBe("01483316245 VE BODNIHD 11100000004 0108080108010101041602160116161604160808");
    
    // Check if the clear button is enabled
    const clearButton = screen.getByTestId("clear-button");
    expect(clearButton).not.toBeDisabled();
  });

  test("updates teleform data when typing in textarea", () => {
    render(
      <Provider store={store}>
        <TeleformReader markingKey={markingKey} />
      </Provider>
    );

    // Simulate typing in the textarea
    const textarea = screen.getByPlaceholderText("Enter teleform scan data here");
    fireEvent.change(textarea, { target: { value: "new data" } });

    // Check if the store was updated
    expect(store.getState().teleform.teleformData).toBe("new data");
  });

  test("clears teleform data when clear button is clicked", () => {
    // Preload some data in the store
    store.dispatch(setTeleformData("01483316245 VE BODNIHD 11100000004 0108080108010101041602160116161604160808"));

    render(
      <Provider store={store}>
        <TeleformReader markingKey={markingKey} />
      </Provider>
    );

    // Clear the data
    const clearButton = screen.getByTestId("clear-button");
    fireEvent.click(clearButton);

    // Check if the store was updated
    expect(store.getState().teleform.teleformData).toBe("");
  });

  test("loads data from file when upload button is clicked", async () => {
    render(
      <Provider store={store}>
        <TeleformReader markingKey={markingKey} />
      </Provider>
    );

    // Click the upload button
    fireEvent.click(screen.getByTestId("mock-upload-button"));

    // Wait for the async file read operation to complete
    await waitFor(() => {
      expect(store.getState().teleform.teleformData).toBe("01483316245 VE BODNIHD 11100000004 0108080108010101041602160116161604160808");
    });
  });

  test("displays parsed data in the table", () => {
    // Preload some data in the store
    store.dispatch(setTeleformData("01483316245 VE BODNIHD 11100000004 0108080108010101041602160116161604160808"));

    render(
      <Provider store={store}>
        <TeleformReader markingKey={markingKey} />
      </Provider>
    );

    // Verify that the teleformReaderUtil.readTeleform was called
    expect(teleformReaderUtil.readTeleform).toHaveBeenCalledWith(
      "01483316245 VE BODNIHD 11100000004 0108080108010101041602160116161604160808"
    );
    
    // Check that the data was parsed and passed to the table
    expect(screen.getByTestId("data-length").textContent).toBe("1");
  });
}); 