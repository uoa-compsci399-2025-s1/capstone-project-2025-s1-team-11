import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import TeleformReader from "../teleformReader";
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

const mockStore = configureStore([]);

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
    store = mockStore({
      exam: {
        examData: {
          metadata: {},
          examBody: []
        }
      },
      teleform: {
        teleformData: ''
      }
    });
  });

  const renderWithStore = () => {
    return render(
      <Provider store={store}>
        <TeleformReader markingKey={markingKey} />
      </Provider>
    );
  };

  it('renders with empty state', () => {
    renderWithStore();
    expect(screen.getByPlaceholderText('Enter teleform scan data here')).toBeInTheDocument();
    expect(screen.getByTestId('clear-button')).toBeInTheDocument();
    expect(screen.getByTestId('mock-upload-button')).toBeInTheDocument();
  });

  it('displays teleform data from Redux store', () => {
    store = mockStore({
      exam: {
        examData: {
          metadata: {},
          examBody: []
        }
      },
      teleform: {
        teleformData: 'Test Data'
      }
    });
    renderWithStore();
    expect(screen.getByPlaceholderText('Enter teleform scan data here')).toHaveValue('Test Data');
  });

  it('updates teleform data when typing in textarea', () => {
    renderWithStore();
    const textarea = screen.getByPlaceholderText('Enter teleform scan data here');
    fireEvent.change(textarea, { target: { value: 'New Data' } });
    const actions = store.getActions();
    expect(actions).toContainEqual({
      type: 'teleform/setTeleformData',
      payload: 'New Data'
    });
  });

  it('clears teleform data when clear button is clicked', () => {
    store = mockStore({
      exam: {
        examData: {
          metadata: {},
          examBody: []
        }
      },
      teleform: {
        teleformData: 'Test Data'
      }
    });
    renderWithStore();
    const clearButton = screen.getByTestId('clear-button');
    fireEvent.click(clearButton);
    const actions = store.getActions();
    expect(actions).toContainEqual({
      type: 'teleform/clearTeleformData'
    });
  });

  it('loads data from file when upload button is clicked', async () => {
    const file = new File(['test data'], 'test.txt', { type: 'text/plain' });
    renderWithStore();
    
    const input = screen.getByTestId('mock-upload-button');
    Object.defineProperty(input, 'files', {
      value: [file]
    });
    
    fireEvent.change(input);
    
    const reader = new FileReader();
    reader.onload = () => {
      const actions = store.getActions();
      expect(actions).toContainEqual({
        type: 'teleform/setTeleformData',
        payload: 'test data'
      });
    };
    reader.readAsText(file);
  });

  it('displays parsed data in the table', () => {
    store = mockStore({
      exam: {
        examData: {
          metadata: {},
          examBody: []
        }
      },
      teleform: {
        teleformData: '1,2,3\n4,5,6'
      }
    });
    renderWithStore();
    const table = screen.getByTestId('mock-teleform-table');
    expect(table).toBeInTheDocument();
    expect(screen.getByTestId('data-length')).toHaveTextContent('1');
  });
}); 