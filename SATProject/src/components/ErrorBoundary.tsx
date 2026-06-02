import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Alert, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          message="Something went wrong"
          description={
            <div>
              <p>An error occurred while displaying the dictionary results.</p>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                Error: {this.state.error?.message}
              </p>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={this.handleReload}
                style={{ marginTop: '12px' }}
              >
                Try Again
              </Button>
            </div>
          }
          type="error"
          showIcon
          style={{ margin: '16px 0' }}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
